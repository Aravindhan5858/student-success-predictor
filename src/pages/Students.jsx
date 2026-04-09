import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'

const riskFilters = ['All', 'High', 'Medium', 'Low']
const pageSize = 4

function Students() {
  const { students, deleteStudent } = useAppContext()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = student.name.toLowerCase().includes(query.toLowerCase())
      const matchesFilter = filter === 'All' || student.riskLevel === filter
      return matchesSearch && matchesFilter
    })
  }, [students, filter, query])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize))
  const pagedStudents = filteredStudents.slice((page - 1) * pageSize, page * pageSize)

  const handleExportPdf = () => {
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('Student Success Prediction System', 14, 18)
    doc.setFontSize(12)
    doc.text('Students Export Report', 14, 26)

    doc.setFontSize(10)
    doc.text(`Search: ${query || 'All'}`, 14, 34)
    doc.text(`Risk Filter: ${filter}`, 14, 40)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 46)

    autoTable(doc, {
      startY: 54,
      head: [['Name', 'Attendance', 'Marks', 'Interaction Score', 'Risk Level']],
      body: filteredStudents.map((student) => [
        student.name,
        `${student.attendance}%`,
        `${student.marks}%`,
        `${student.interactionScore}%`,
        student.riskLevel,
      ]),
      styles: {
        fontSize: 10,
        cellPadding: 3,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    })

    doc.save('students-report.pdf')
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_auto] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Search</label>
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Search student name"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Filter by Risk</label>
            <select
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {riskFilters.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <Button fullWidth={false} className="md:justify-self-end" onClick={handleExportPdf}>
            Export PDF
          </Button>
        </div>
      </Card>

      <Table headers={['Name', 'Attendance', 'Marks', 'Interaction Score', 'Risk Level', 'Actions']}>
        {pagedStudents.map((student) => (
          <tr key={student.id} className="hover:bg-slate-50">
            <td className="px-4 py-4 font-medium text-slate-900">{student.name}</td>
            <td className="px-4 py-4 text-slate-600">{student.attendance}%</td>
            <td className="px-4 py-4 text-slate-600">{student.marks}%</td>
            <td className="px-4 py-4 text-slate-600">{student.interactionScore}%</td>
            <td className="px-4 py-4">
              <Badge tone={student.riskLevel.toLowerCase()}>{student.riskLevel}</Badge>
            </td>
            <td className="px-4 py-4">
              <div className="flex items-center gap-3">
                <Link to={`/student/${student.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  View
                </Link>
                <Link to={`/edit-student/${student.id}`} className="text-sm font-medium text-amber-600 hover:text-amber-700">
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => deleteStudent(student.id)}
                  className="text-sm font-medium text-rose-600 hover:text-rose-700"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredStudents.length)} of {filteredStudents.length}
        </p>
        <div className="flex items-center gap-2">
          <Button fullWidth={false} variant="outline" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            Prev
          </Button>
          <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            Page {page} / {totalPages}
          </div>
          <Button
            fullWidth={false}
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Next
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default Students
